import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiMessageCircle, FiCornerDownRight, FiTrash2, FiHeart, FiUser } from "react-icons/fi";
import { createComment, getComments, deleteComment, likeComment } from "../lib/firebase-client";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import Link from "next/link";

export default function CommentSection({ targetId, targetType = "blog" }) {
  const { user, userData, isLoggedIn: _isLoggedIn } = useAuth();
  const { joinRoom, leaveRoom, subscribe, emitNewComment, emitCommentDelete, emitCommentLike, emitTyping } = useSocket();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  // Join room and subscribe to real-time events
  useEffect(() => {
    if (targetId) {
      const room = `${targetType}:${targetId}`;
      joinRoom(room);

      // Subscribe to comment events
      const unsubscribeAdd = subscribe("comment:added", (comment) => {
        setComments(prev => {
          if (comment.parentId) {
            // It's a reply - add to parent's replies
            return prev.map(c => {
              if (c.id === comment.parentId) {
                return { ...c, replies: [...(c.replies || []), comment] };
              }
              return c;
            });
          } else {
            // It's a new parent comment
            const exists = prev.some(c => c.id === comment.id);
            if (exists) return prev;
            return [{ ...comment, replies: [] }, ...prev];
          }
        });
      });

      const unsubscribeRemove = subscribe("comment:removed", ({ commentId }) => {
        setComments(prev => {
          // Check if it's a parent comment
          const isParent = prev.some(c => c.id === commentId);
          if (isParent) {
            return prev.filter(c => c.id !== commentId);
          }
          // It's a reply - remove from parent
          return prev.map(c => ({
            ...c,
            replies: (c.replies || []).filter(r => r.id !== commentId)
          }));
        });
      });

      const unsubscribeLike = subscribe("comment:likeUpdate", ({ commentId, likes }) => {
        setComments(prev => prev.map(c => {
          if (c.id === commentId) {
            return { ...c, likes };
          }
          // Check replies
          return {
            ...c,
            replies: (c.replies || []).map(r => 
              r.id === commentId ? { ...r, likes } : r
            )
          };
        }));
      });

      const unsubscribeTyping = subscribe("comment:userTyping", ({ userId, userName, isTyping }) => {
        if (userId === user?.uid) return; // Ignore own typing
        setTypingUsers(prev => {
          if (isTyping) {
            const exists = prev.some(u => u.userId === userId);
            if (exists) return prev;
            return [...prev, { userId, userName }];
          }
          return prev.filter(u => u.userId !== userId);
        });
      });

      return () => {
        leaveRoom(room);
        unsubscribeAdd();
        unsubscribeRemove();
        unsubscribeLike();
        unsubscribeTyping();
      };
    }
  }, [targetId, targetType, joinRoom, leaveRoom, subscribe, user]);

  useEffect(() => {
    fetchComments();
  }, [targetId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const allComments = await getComments(targetId, targetType);
      // Organize comments with replies
      const parentComments = allComments.filter(c => !c.parentId);
      const repliesMap = {};
      allComments.filter(c => c.parentId).forEach(reply => {
        if (!repliesMap[reply.parentId]) repliesMap[reply.parentId] = [];
        repliesMap[reply.parentId].push(reply);
      });
      
      const organized = parentComments.map(comment => ({
        ...comment,
        replies: repliesMap[comment.id] || []
      }));
      
      setComments(organized);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle typing indicator
  const handleTyping = useCallback((isTyping) => {
    if (user) {
      emitTyping(targetId, targetType, user.uid, userData?.name || user.displayName || "Anonymous", isTyping);
    }
  }, [targetId, targetType, user, userData, emitTyping]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    handleTyping(false); // Stop typing indicator
    try {
      const result = await createComment({
        targetId,
        targetType,
        content: newComment.trim(),
        authorId: user.uid,
        authorName: userData?.name || user.displayName || "Anonymous",
        authorPhoto: userData?.photoURL || user.photoURL || null,
      });
      
      // Emit real-time event
      if (result?.comment) {
        emitNewComment(targetId, targetType, result.comment);
      }
      
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId) => {
    if (!replyText.trim() || !user) return;

    setSubmitting(true);
    handleTyping(false);
    try {
      const result = await createComment({
        targetId,
        targetType,
        parentId,
        content: replyText.trim(),
        authorId: user.uid,
        authorName: userData?.name || user.displayName || "Anonymous",
        authorPhoto: userData?.photoURL || user.photoURL || null,
      });
      
      // Emit real-time event
      if (result?.comment) {
        emitNewComment(targetId, targetType, result.comment);
      }
      
      setReplyText("");
      setReplyTo(null);
      fetchComments();
    } catch (error) {
      console.error("Error creating reply:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteComment(commentId);
      // Emit real-time event
      emitCommentDelete(targetId, targetType, commentId);
      fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleLike = async (commentId) => {
    if (!user) return;
    try {
      const result = await likeComment(commentId);
      // Emit real-time event
      if (result?.likes !== undefined) {
        emitCommentLike(targetId, targetType, commentId, result.likes);
      }
      fetchComments();
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const CommentItem = ({ comment, isReply = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? "ml-8 border-l-2 border-gray-200 pl-4" : ""}`}
    >
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {comment.authorPhoto ? (
              <img src={comment.authorPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <FiUser className="w-5 h-5 text-gray-500" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-800">{comment.authorName}</span>
              <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
            </div>
            <p className="text-gray-700">{comment.content}</p>
            
            {/* Actions */}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => handleLike(comment.id)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition"
              >
                <FiHeart className="w-4 h-4" />
                {comment.likes || 0}
              </button>
              {!isReply && user && (
                <button
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition"
                >
                  <FiCornerDownRight className="w-4 h-4" />
                  Reply
                </button>
              )}
              {user && comment.authorId === user.uid && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reply Form */}
        {replyTo === comment.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 ml-12"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                onClick={() => handleSubmitReply(comment.id)}
                disabled={!replyText.trim() || submitting}
                className="btn-primary px-4"
              >
                <FiSend />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Replies */}
      {comment.replies?.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiMessageCircle />
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {userData?.photoURL || user.photoURL ? (
                <img src={userData?.photoURL || user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <FiUser className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  handleTyping(e.target.value.length > 0);
                }}
                onBlur={() => handleTyping(false)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="btn-primary px-6 flex items-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiSend /> Post
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600 mb-3">Please login to post a comment</p>
          <Link href="/login" className="btn-primary inline-block">
            Login to Comment
          </Link>
        </div>
      )}

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-sm text-gray-500 flex items-center gap-2"
        >
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
          </div>
          <span>
            {typingUsers.length === 1 
              ? `${typingUsers[0].userName} is typing...`
              : `${typingUsers.length} people are typing...`
            }
          </span>
        </motion.div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="spinner"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FiMessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}
