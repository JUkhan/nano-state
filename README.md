# nano-state
react state management lib

## App state

```ts
import { createStore } from "nano-state";

export type AppState = {
    counter: {
        count: number;
        loading: boolean;
    };
    todos: {
        visibility:'all'|'active'|'completed'
        items: {
            id: number;
            text: string;
            completed: boolean;
        }[];
    };
}

export const {read, write, dispatch, useStoreEffect, useSelector} = createStore<AppState>({
    counter: {
        count: 0,
        loading: false,
    },
    todos: {
        visibility:'all',
        items: [],
    }
});

```

## Counter

```tsx
'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSelector, write } from '@/app/appState';



const Counter: React.FC = () => {
    const {count, loading} = useSelector(state => state.counter);
    
    const decrement = () => {
        write(state =>{
            const counter={...state.counter};
            counter.count--;
            return {counter}
        });
    };
    const increment = () => {
        write(state => ({ counter: { count: state.counter.count! + 1, loading: false } }));
    };
    const asyncInc = () => {
        write(state => ({ counter: { ...state.counter, loading: true } }));
        setTimeout(() => {
            write(state => ({ counter: { count: state.counter.count! + 1, loading: false } }));
        }, 1000);
    }

    const loadingText = loading ? "Loading..." : count;
    
    return (
        <div className="flex flex-col items-center space-y-4">
            <h2 className="text-2xl font-bold">Counter: {loadingText}</h2>
            <div className="flex space-x-4">
                <Button onClick={decrement}>Decrease</Button>
                <Button onClick={increment}>Increase</Button>
                <Button onClick={asyncInc}>AsyncIncrease</Button>
            </div>
        </div>
    );
};

export default Counter;


```

## Todo

```tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSelector, write } from '@/app/appState';

const Todo: React.FC = () => {
    const [newTodo, setNewTodo] = useState('');
    const { items, visibility } = useSelector(state => state.todos);

    const addTodo = () => {
        if (newTodo.trim()) {
            write(state => {
                const todos={...state.todos};
                todos.items.push({
                    id: Date.now(),
                    text: newTodo.trim(),
                    completed: false
                });
                return {todos}
            });
            setNewTodo('');
        }
    };

    const toggleTodo = (id: number) => {
        write(state => ({
            todos: {
                ...state.todos,
                items: state.todos.items!.map(todo =>
                    todo.id === id ? { ...todo, completed: !todo.completed } : todo
                )
            }
        }));
    };

    const filteredTodos = items.filter(todo => {
        if (visibility === 'active') return !todo.completed;
        if (visibility === 'completed') return todo.completed;
        return true;
    });

    const setVisibility = (newVisibility: 'all' | 'active' | 'completed') => {
        write(state => ({
            todos: { ...state.todos, visibility: newVisibility }
        }));
    };
    
    return (
        <div className="flex flex-col items-center space-y-4">
            <h2 className="text-2xl font-bold">Todo List</h2>
            <div className="flex space-x-2">
                <Input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Add new todo"
                />
                <Button onClick={addTodo}>Add</Button>
            </div>
            <div className="flex space-x-2">
                <Button onClick={() => setVisibility('all')}>All</Button>
                <Button onClick={() => setVisibility('active')}>Active</Button>
                <Button onClick={() => setVisibility('completed')}>Completed</Button>
            </div>
            <ul className="space-y-2">
                {filteredTodos.map(todo => (
                    <li key={todo.id} className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => toggleTodo(todo.id)}
                        />
                        <span className={todo.completed ? 'line-through' : ''}>
                            {todo.text}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Todo;


```