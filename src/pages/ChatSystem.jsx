import React from 'react'
import ChatApp from '../messages/App'
import '../messages/index.css'

export default function ChatSystem({ recipient, navigate, user }) {
  return <ChatApp recipient={recipient} navigate={navigate} user={user} />
}
