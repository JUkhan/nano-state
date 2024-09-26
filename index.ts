import React from 'react';

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

export function createState<T extends object>(initialValue: T): {
    read: () => T;
    write: (fn: (state: T) => Partial<T>) => void;
    dispatch: (action: any) => void;
    useStoreEffect: (matcher: (action: any) => boolean, callback: (action: any) => void) => void;
    useSelector: <S>(selector: (state: T) => S) => S;
} {
    let value = initialValue;
    const subscribers = new Set<(value: T) => void>();
    const dispatcher = new Set<(value: any) => void>();
    const read = () => value as T;

    const write = (fn: (state: T) => Partial<T>) => {
        value = Object.assign({}, value, fn(value));
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
                    setValue(_ => selectedValue);
                }
            });
            return () => {
                unsubscribe();
            };
        }, [selector, value]);

        return value;
    };
    const useStoreEffect = (matcher: (value: any) => boolean, callback: (value: any) => void) => {
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

    return { read, write, dispatch, useStoreEffect, useSelector };
}
