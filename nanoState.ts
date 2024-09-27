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
 * @returns An object containing methods to read, write, dispatch actions, and use selectors and effects.
 * 
 * @template T - The type of the state object.
 * 
 * @example
 * const { read, write, dispatch, useStoreEffect, useSelector } = createState({ count: 0 });
 * 
 * // Reading the state
 * const currentState = read();
 * 
 * // Writing to the state
 * write(state => ({ count: state.count + 1 }));
 * 
 * // Dispatching an action
 * dispatch({ type: 'INCREMENT' });
 * 
 * // Using a selector
 * const count = useSelector(state => state.count);
 * 
 * // Using store effect
 * useStateEffect(action => action.type === 'INCREMENT', action => {
 *     console.log('Increment action dispatched:', action);
 * });
 */
export function createState<T extends object>(initialValue: T): {
    read: () => T;
    write: (fn: Partial<T> | ((state: T) => Partial<T>)) => void;
    dispatch: (action: any) => void;
    useStateEffect: (matcher: (action: any) => boolean, callback: (action: any) => void) => void;
    useSelector: <S>(selector: (state: T) => S) => S;
} {
    let value = initialValue;
    const subscribers = new Set<(value: T) => void>();
    const dispatcher = new Set<(value: any) => void>();
    const read = () => value as T;
    const write = (fn: Partial<T> | ((state: T) => Partial<T>)):void => {
        value = Object.assign({}, value, typeof fn ==='function'? fn(value): fn);
        Object.freeze(value);
        subscribers.forEach(subscriber => subscriber(value));
    };
    const subscribe = (subscriber: (value: T) => void) => {
        subscribers.add(subscriber);
        return () => subscribers.delete(subscriber);
    };
    const useSelector = <S>(selector: (state: T) => S): S => {
        const [value, setValue] = React.useState(selector(read()));
        React.useEffect(() => {
            const unsubscribe = subscribe((newValue: T) => {
                const selectedValue = selector(newValue);
                if (!shallowEqual(selectedValue, value)) {
                    setValue((ols: S) => selectedValue);
                }
            });
            return () => {
                unsubscribe();
            };
        }, [selector, value]);

        return value;
    };
    const useStateEffect = (matcher: (value: any) => boolean, callback: (value: any) => void) => {
        React.useEffect(() => {
            const unsubscribe = subscribeForDispatcher((newValue) => {
                if (matcher(newValue)) {
                    callback(newValue);
                }
            });
            return () => {
                unsubscribe();
            };
        }, [matcher, callback]);
    };
    const subscribeForDispatcher = (subscriber: (value: T) => void) => {
        dispatcher.add(subscriber);
        return () => dispatcher.delete(subscriber);
    };
    const dispatch = (action: any) => {
        if (typeof action === 'function') {
            action();
        } else {
            dispatcher.forEach(subscriber => subscriber(action));
        }
    };

    return { read, write, dispatch, useStateEffect, useSelector };
}
