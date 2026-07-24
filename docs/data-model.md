# Data model

Core entities:

- User
- Workspace / WorkspaceMember (OWNER, ADMIN, MEMBER)
- Invite
- Channel / ChannelMember (PUBLIC, PRIVATE)
- Conversation / ConversationMember (DIRECT, GROUP)
- Message (optional parentId for threads, mentionedIds)
- Reaction
- Attachment
- Notification
- RefreshToken

Indexes prioritize timeline reads: `(channelId, createdAt)`, `(conversationId, createdAt)`, `(parentId, createdAt)`.
