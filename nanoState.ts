import React from 'npm:react@~18.0.0';

function is(x: unknown, y: unknown) {
    if (x === y) {
        return x !== 0 || y !== 0 || 1 / x === 1 / y;
    } else {
        return x !== x && y !== y;
    }
}

function shallowEqual(objA: any, objB: any) {
    if (is(objA, objB)) return true;

    if (
        typeof objA !== 'object' ||
        objA === null ||
        typeof objB !== 'object' ||
        objB === null
    ) {
        return false;
    }

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) return false;

    for (let i = 0; i < keysA.length; i++) {
        if (
            !Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
            !is(objA[keysA[i]], objB[keysA[i]])
        ) {
            return false;
        }
    }

    return true;
}


/**
 * Creates a state management system for a given initial value.
 * 
 * @param initialValue - The initial state value of type T.
 * @returns An object containing methods to getState, setState, dispatch actions, and use selectors and effects.
 * 
 * @template T - The type of the state object.
 * 
 * @example
 * const { getState, setState, dispatch, useStateEffect, useSelector, select } = createState({ count: 0 });
 * 
 * // Reading the state
 * const currentState = getState();
 * 
 * // Writing to the state
 * setState(state => ({ count: state.count + 1 }));
 * 
 * // Dispatching an action
 * dispatch({ type: 'INCREMENT' });
 * 
 * // Using a selector
 * const count = useSelector(state => state.count);
 * 
 * // Using state effect
 * useStateEffect(action => action.type === 'INCREMENT', action => {
 *     console.log('Increment action dispatched:', action);
 * });
 */
export function createState<T extends object>(initialValue: T): {
    getState: () => T;
    setState: (fn: Partial<T> | ((state: T) => Partial<T>)) => void;
    dispatch: (action: any) => void;
    useStateEffect: (matcher: (action: any) => boolean, callback: (action: any) => void) => void;
    useSelector: <S>(selector: (state: T) => S) => S;
    select: <S>(selector: (state: T) => S) => S;
    subscribe: (subscriber: (value: T) => void) => () => void;
} {
    let value = initialValue;
    const subscribers = new Set<(value: T) => void>();
    const dispatcher = new Set<(value: any) => void>();
    const getState = () => value as T;
    const setState = (fn: Partial<T> | ((state: T) => Partial<T>)): void => {
        Object.assign(value, typeof fn === 'function' ? fn(value) : fn);
        subscribers.forEach(subscriber => subscriber(value));
    };
    const useSelector = <S>(selector: (state: T) => S): S => {
        const [, forcrRender] = React.useState(0);
        const slice = React.useRef(selector(value))
        React.useEffect(() => subscribe((newValue: T) => {
            const selectedValue = selector(newValue);
            if (!shallowEqual(selectedValue, slice.current)) {
                forcrRender((prev) => (prev + 1) % Number.MAX_SAFE_INTEGER);
                slice.current = selectedValue;
            }
        }), []);
        return slice.current;
    };
    const subscribe = (subscriber: (value: T) => void) => {
        subscribers.add(subscriber);
        return () => { subscribers.delete(subscriber); }
    };
    const useStateEffect = (matcher: (action: any) => boolean, callback: (action: any) => void) => {
        React.useEffect(() => subscribeForDispatcher((action) => {
            if (matcher(action)) {
                callback(action);
            }
        }), []);
    };
    const subscribeForDispatcher = (subscriber: (value: T) => void) => {
        dispatcher.add(subscriber);
        return () => { dispatcher.delete(subscriber); }
    };
    const dispatch = (action: any) => {
        if (typeof action === 'function') {
            action();
        } else {
            dispatcher.forEach(subscriber => subscriber(action));
        }
    };
    const select = <S>(selector: (state: T) => S): S => {
        const target = selector(value) as any;
        if (Array.isArray(target)) {
            return target.slice() as S;
        }
        else if (typeof target === 'object') {
            return Object.keys(target).reduce((newObj, prop) => {
                if (Array.isArray(target[prop])) {
                    newObj[prop] = target[prop].slice();
                } else {
                    newObj[prop] = target[prop]
                }
                return newObj;
            }, {} as any) as S;
        }
        return target;
    };

    return { getState, setState, dispatch, useStateEffect, useSelector, select, subscribe };
}