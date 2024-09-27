# nano-state
react state management lib

## App state

```ts
import { createState } from "@/nanoState";

export type AppState = {
    counter: {
        count: number;
        loading: boolean;
    };
    todos: {
        visibility:'all'|'active'|'completed';
        items: {
            id: number;
            text: string;
            completed: boolean;
        }[];
    };
    newTodo:string;
}

export const {read, write, dispatch, useStoreEffect, useSelector} = createState<AppState>({
    counter: {
        count: 0,
        loading: false,
    },
    todos: {
        visibility:'all',
        items: [],
    },
    newTodo:'',
});

```

## Counter

```tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useSelector, write, read } from '@/app/appState';

const decrement = () => {
    write(state =>{
        const counter={...state.counter};
        counter.count--;
        return {counter}
    });
};

const increment = () => {
    write(state => ({ counter: { count: state.counter.count + 1, loading: false } }));
};

const asyncInc = () => {
    write(state => ({ counter: { ...state.counter, loading: true } }));
    setTimeout(() => {
        write(state => ({ counter: { count: state.counter.count + 1, loading: false } }));
    }, 1000);
}

const Counter: React.FC = () => {
    const {count, loading} = useSelector(state => state.counter);

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

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSelector, write, read, type AppState } from '@/app/appState';


const addTodo = () => {
    const newTodo = read().newTodo;
    if (newTodo.trim()) {
        write(state => {
            const todos = { ...state.todos };
            todos.items = [...todos.items, {
                id: Date.now(),
                text: newTodo.trim(),
                completed: false
            }];
            return { todos }
        });
        write({ newTodo: '' });
    }
};

const toggleTodo = (id: number) => {
    write(state => ({
        todos: {
            ...state.todos,
            items: state.todos.items.map(todo =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
        }
    }));
};


const setVisibility = (newVisibility: 'all' | 'active' | 'completed') => {
    write(state => ({
        todos: { ...state.todos, visibility: newVisibility }
    }));
};

const todoSelector = (state: AppState) => state.todos;
const newTodoSelector = (state: AppState) => state.newTodo;

const Todo: React.FC = () => {
    const newTodo = useSelector(newTodoSelector);
    const { items, visibility } = useSelector(todoSelector);

    const filteredTodos = useMemo(() => items.filter(todo => {
        if (visibility === 'active') return !todo.completed;
        if (visibility === 'completed') return todo.completed;
        return true;
    }), [items, visibility]);
   
    return (
        <div className="flex flex-col items-center space-y-4">
            <h2 className="text-2xl font-bold">Todo List</h2>
            <div className="flex space-x-2">
                <Input
                    type="text"
                    value={newTodo}
                    onChange={(e) => write({ newTodo: e.target.value })}
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