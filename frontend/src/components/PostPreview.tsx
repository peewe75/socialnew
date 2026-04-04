import { FC, useState } from 'react';

interface PostPreviewProps {
  post: {
    platform: string;
    content: string;
    hashtags: string[];
  };
  onEdit: (content: string) => void;
}

export const PostPreview: FC<PostPreviewProps> = ({ post, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);

  const platformStyles = {
    linkedin: 'bg-blue-50 border-blue-200',
    facebook: 'bg-blue-50 border-blue-200',
    instagram: 'bg-pink-50 border-pink-200',
    tiktok: 'bg-black text-white border-gray-700',
  };

  const platformIcons = {
    linkedin: '💼',
    facebook: 'f',
    instagram: '📷',
    tiktok: '🎵',
  };

  return (
    <div className={`card border-2 ${platformStyles[post.platform as keyof typeof platformStyles]}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{platformIcons[post.platform as keyof typeof platformIcons]}</span>
          <span className="font-bold text-gray-900 capitalize">{post.platform}</span>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {isEditing ? '✓ Done' : '✏️ Edit'}
        </button>
      </div>

      {isEditing ? (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          onBlur={() => onEdit(editedContent)}
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg mb-3"
        />
      ) : (
        <p className="text-gray-900 mb-3">{editedContent || post.content}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {post.hashtags.map((tag) => (
          <span key={tag} className="inline-block px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-300 text-xs text-gray-600">
        Length: {editedContent.length} chars | Max: 280
      </div>
    </div>
  );
};

export default PostPreview;