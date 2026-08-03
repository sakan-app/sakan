/** Centralised query keys for the social graph feature. */
export const socialKeys = {
  likesMine: (userId: string) => ["social", "likes", "mine", userId] as const,
  likedMe: (userId: string) => ["social", "likes", "likedMe", userId] as const,
  isLiked: (userId: string, targetId: string) => ["social", "likes", "is", userId, targetId] as const,
  favorites: (userId: string) => ["social", "favorites", userId] as const,
  matches: (userId: string, sort: string, filter: unknown) =>
    ["social", "matches", userId, sort, filter] as const,
  matchesAll: (userId: string) => ["social", "matches", userId] as const,
};

export const notificationKeys = {
  list: (userId: string) => ["notifications", "list", userId] as const,
  archived: (userId: string) => ["notifications", "archived", userId] as const,
  unreadCount: (userId: string) => ["notifications", "unread", userId] as const,
};
