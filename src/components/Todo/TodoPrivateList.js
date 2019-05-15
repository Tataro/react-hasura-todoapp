import React, { Component, Fragment } from 'react'

import TodoItem from './TodoItem'
import TodoFilters from './TodoFilters'
import gql from 'graphql-tag'
import { Query } from 'react-apollo'

const GET_MY_TODOS = gql`
  query getmyTodos {
    todos(
      where: { is_public: { _eq: false } }
      order_by: { created_at: desc }
    ) {
      id
      title
      created_at
      is_completed
    }
  }
`

class TodoPrivateList extends Component {
  constructor(props) {
    super(props)

    this.state = {
      filter: 'all',
      clearInProgress: false
    }

    this.filterResults = this.filterResults.bind(this)
    this.clearCompleted = this.clearCompleted.bind(this)

    // Set the apollo client
    this.client = props.client
  }

  filterResults(filter) {
    this.setState({
      ...this.state,
      filter: filter
    })
  }

  clearCompleted() {
    const CLEAR_COMPLETED = gql`
      mutation clearCompletion {
        delete_todos(
          where: { is_completed: { _eq: true }, is_public: { _eq: false } }
        ) {
          affected_rows
        }
      }
    `

    this.client.mutate({
      mutation: CLEAR_COMPLETED,
      optimisticResponse: {},
      update: cache => {
        const { todos } = cache.readQuery({ query: GET_MY_TODOS })
        cache.writeQuery({
          query: GET_MY_TODOS,
          data: {
            todos: todos.filter(t => !t.is_completed)
          }
        })
      }
    })
  }

  render() {
    const { todos } = this.props
    let filteredTodos = todos
    if (this.state.filter === 'active') {
      filteredTodos = todos.filter(todo => todo.is_completed !== true)
    } else if (this.state.filter === 'completed') {
      filteredTodos = todos.filter(todo => todo.is_completed === true)
    }

    const todoList = []
    filteredTodos.forEach((todo, index) => {
      todoList.push(<TodoItem key={index} index={index} todo={todo} />)
    })

    return (
      <Fragment>
        <div className="todoListWrapper">
          <ul>{todoList}</ul>
        </div>

        <TodoFilters
          todos={filteredTodos}
          currentFilter={this.state.filter}
          filterResultsFn={this.filterResults}
          clearCompletedFn={this.clearCompleted}
          clearInProgress={this.state.clearInProgress}
        />
      </Fragment>
    )
  }
}

const TodoPrivateListQuery = () => {
  return (
    <Query query={GET_MY_TODOS}>
      {({ loading, error, data, client }) => {
        if (loading) {
          return <div>...Loading</div>
        }
        if (error) {
          return <div>Error...</div>
        }
        return <TodoPrivateList client={client} todos={data.todos} />
      }}
    </Query>
  )
}
export default TodoPrivateListQuery
export { GET_MY_TODOS }
