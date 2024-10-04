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
            newTodo:string;
        }[];
        
    };
    
}

export const {getState, setState, dispatch, useStateEffect, useSelector, select} = createState<AppState>({
    counter: {
        count: 0,
        loading: false,
    },
    todos: {
        visibility:'all',
        items: [],
        newTodo:'',
    } 
});
```
## counterController

```ts
import { setState, dispatch, select, type AppState } from '@/app/appState';

export default {
    decrement() {
        const counter = select(state => state.counter);
        counter.count--;
        setState({ counter });
    },

    increment() {
        const counter = select(state => state.counter);
        counter.count++;
        setState({ counter });
    },

    asyncInc() {
        setState(state => ({ counter: { ...state.counter, loading: true } }));
        setTimeout(() => {
            setState(state => ({ counter: { count: state.counter.count + 1, loading: false } }));
        }, 1000);
    },
    counterSelector: (sate: AppState) => sate.counter
}
```
## Counter component

```tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ReloadIcon } from "@radix-ui/react-icons"
import { useSelector, dispatch } from '@/app/appState';
import counterController from './counterController'


const Counter: React.FC = () => {
    const { count, loading } = useSelector(counterController.counterSelector);

    return (
        <div className="flex flex-col items-center space-y-4">
            <h2 className="text-2xl font-bold">Counter: {count}</h2>
            <div className="flex space-x-4">
                <Button onClick={counterController.decrement}>Decrease</Button>
                <Button onClick={counterController.increment}>Increase</Button>
                <Button disabled={loading} onClick={counterController.asyncInc}>
                    {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                    AsyncIncrease
                </Button>
            </div>
        </div>
    );
};

export default Counter;

```

## todoController

```ts
import { setState, select, type AppState } from '@/app/appState';

export default {
    addTodo() {
        const todos = select(state => state.todos);
        if (todos.newTodo.trim()) {
            todos.items.push({ id: Date.now(), text: newTodo.trim(), completed: false });
            todos.newTodo = '';
            setState({ todos });
        }
    },
    toggleTodo(id: number){
        const todos = select(state => state.todos);
        todos.items = todos.items.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        setState({ todos });
    },
    setVisibility(newVisibility: 'all' | 'active' | 'completed') {
        setState(state => ({
            todos: { ...state.todos, visibility: newVisibility }
        }));
    },
    inputValueChange(newTodo:string){
        setState(state=>({todos:{...state.todos, newTodo }}))
    },
    todoSelector : (state: AppState) => ({items:state.todos.items, visibility:state.todos.visibility}),
    newTodoSelector : (state: AppState) => state.todos.newTodo
}

```

## Todo Component

```tsx
'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setState, useSelector, useStateEffect } from '@/app/appState';
import todoController from './todoController';

const AddTodo:React.FC= ()=>{
    const newTodo = useSelector(todoController.newTodoSelector);
    return <div className="flex space-x-2">
                <Input
                    type="text"
                    value={newTodo}
                    onChange={(e) => todoController.inputValueChange( e.target.value)}
                    placeholder="Add new todo"
                />
                <Button onClick={todoController.addTodo}>Add</Button>
            </div>  
}

const Todo: React.FC = () => {
    const { items, visibility } = useSelector(todoController.todoSelector);
    const filteredTodos = useMemo(() => items.filter(todo => {
        if (visibility === 'active') return !todo.completed;
        if (visibility === 'completed') return todo.completed;
        return true;
    }), [items, visibility]);

    return (
        <div className="flex flex-col items-center space-y-4">
            <h2 className="text-2xl font-bold">Todo List</h2>
            <AddTodo/>
            <div className="flex space-x-2">
                <Button onClick={() => todoController.setVisibility('all')}>All</Button>
                <Button onClick={() => todoController.setVisibility('active')}>Active</Button>
                <Button onClick={() => todoController.setVisibility('completed')}>Completed</Button>
            </div>
            <ul className="space-y-2">
                {filteredTodos.map(todo => (
                    <li key={todo.id} className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => todoController.toggleTodo(todo.id)}
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