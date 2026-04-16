import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { relativeTime } from '@minga/logic';
import type { CommentWithAuthor } from '@minga/types';
import { Avatar } from '../primitives/Avatar';
import { TierBadge } from '../primitives/TierBadge';
import { Input } from '../primitives/Input';
import { Button } from '../primitives/Button';

export function CommentThread({
  comments,
  onReply,
  depth = 0,
}: {
  comments: CommentWithAuthor[];
  onReply?: (parentId: string, body: string) => Promise<void>;
  depth?: number;
}) {
  return (
    <View style={{ gap: spacing.md, marginLeft: depth > 0 ? spacing.xl : 0 }}>
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} onReply={onReply} depth={depth} />
      ))}
    </View>
  );
}

function CommentItem({
  comment,
  onReply,
  depth,
}: {
  comment: CommentWithAuthor;
  onReply?: (parentId: string, body: string) => Promise<void>;
  depth: number;
}) {
  const { theme } = useTheme();
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!onReply || !draft.trim()) return;
    setBusy(true);
    try {
      await onReply(comment.id, draft.trim());
      setDraft('');
      setReplying(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: theme.border,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <Avatar uri={comment.author.avatar_url} name={comment.author.display_name} size={32} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: fontWeights.semibold, fontSize: fontSizes.sm }}>
            {comment.author.display_name}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs }}>
            {relativeTime(comment.created_at)}
          </Text>
        </View>
        <TierBadge tier={comment.author.tier} />
      </View>
      <Text style={{ color: theme.text, fontSize: fontSizes.md, lineHeight: 22 }}>{comment.body}</Text>
      {depth < 2 && onReply ? (
        <Pressable onPress={() => setReplying((r) => !r)}>
          <Text style={{ color: theme.primary, fontSize: fontSizes.sm, fontWeight: fontWeights.semibold }}>
            {replying ? 'Cancel' : 'Reply'}
          </Text>
        </Pressable>
      ) : null}
      {replying ? (
        <View style={{ gap: spacing.sm }}>
          <Input placeholder="Write a reply…" value={draft} onChangeText={setDraft} multiline />
          <Button label="Post reply" loading={busy} onPress={submit} size="sm" />
        </View>
      ) : null}
      {comment.replies && comment.replies.length > 0 ? (
        <CommentThread comments={comment.replies} onReply={onReply} depth={depth + 1} />
      ) : null}
    </View>
  );
}
