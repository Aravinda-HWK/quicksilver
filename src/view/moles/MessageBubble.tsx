import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import MessageContent from "../atoms/MessageContent";
import MessageMeta from "../atoms/MessageMeta";
import AttachmentList from "./AttachmentList";
import AttachmentViewer from "./AttachmentViewer";
import { isRichHtml } from "../../nonview/email/htmlKind";
import { stripQuotedText } from "../../nonview/email/quotedText";

// Corner radii for bubble stacks: the sender-side corners of grouped bubbles
// shrink so consecutive messages visually "fuse" (DESIGN.md, Shapes).
const RADIUS = 18;
const FUSED_RADIUS = 6;

const MessageBubble = ({
  message,
  isSent,
  onDownloadAttachment,
  onFetchAttachment,
  isFirstInGroup = true,
  isLastInGroup = true,
}) => {
  // Full HTML email bodies are documents, not chat messages — they need the
  // whole column width. Plain-text replies stay in the narrow chat-bubble look.
  const rich = isRichHtml(message.contentHtml);
  // Chat view shows only the new text a reply added, not the quoted original
  // that replyContext.ts appends before sending.
  const displayText = rich ? message.content : stripQuotedText(message.content);

  // Map the server attachment DTO (id/filename/mime_type/size) onto the shape
  // AttachmentPreview/AttachmentInfo expect (id/name/size).
  const attachments = (message.attachments || []).map((a) => ({
    id: a.id,
    name: a.filename,
    size: a.size,
    mimeType: a.mime_type,
  }));

  // In-app preview dialog state. The blob object URL is created here on open
  // and revoked on close/unmount so we never leak memory across previews.
  const [preview, setPreview] = useState(null);
  const urlRef = useRef(null);

  const revoke = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };
  useEffect(() => revoke, []); // cleanup on unmount

  const handlePreview = async (att) => {
    if (!onFetchAttachment) return;
    revoke();
    setPreview({
      id: att.id,
      name: att.name,
      mimeType: att.mimeType,
      url: null,
      loading: true,
      error: null,
    });
    try {
      const blob = await onFetchAttachment(message.sourceThreadId, att.id);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setPreview((p) =>
        p ? { ...p, url, loading: false } : p,
      );
    } catch (e) {
      setPreview((p) =>
        p
          ? { ...p, loading: false, error: e?.message || "Preview failed" }
          : p,
      );
    }
  };

  const closePreview = () => {
    revoke();
    setPreview(null);
  };

  // Fused corners: outer corners keep the full radius; the sender-side corners
  // between grouped bubbles shrink. CSS order is TL TR BR BL.
  const topFuse = isFirstInGroup ? RADIUS : FUSED_RADIUS;
  const bottomFuse = isLastInGroup ? RADIUS : FUSED_RADIUS;
  const bubbleRadius = isSent
    ? `${RADIUS}px ${topFuse}px ${bottomFuse}px ${RADIUS}px`
    : `${topFuse}px ${RADIUS}px ${RADIUS}px ${bottomFuse}px`;

  return (
    <Box
      sx={(theme) =>
        rich
          ? {
              // Rich HTML emails are documents, not chat lines: full-width
              // card on an always-light surface so the email's own colors
              // stay readable in dark mode too.
              alignSelf: "stretch",
              // "High-clarity card": near-opaque white with a hairline teal
              // cyber-border instead of a heavy shadow (DESIGN.md).
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              color: "#191C1E",
              border: "1px solid rgba(0, 105, 111, 0.10)",
              borderRadius: "16px",
              px: 2.5,
              py: 2,
              width: "auto",
              maxWidth: "100%",
              minWidth: 0,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
              ...theme.applyStyles("dark", {
                backgroundColor: "#FFFFFF",
                borderColor: "rgba(255, 255, 255, 0.14)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
                // The card stays light in dark mode, so its meta row (timestamp,
                // read check, attachment labels) must not use the dark scheme's
                // near-white text tokens.
                "& .MuiTypography-root, & .MuiSvgIcon-root": {
                  color: "#3A494B",
                },
              }),
            }
          : {
              alignSelf: isSent ? "flex-end" : "flex-start",
              // Glass bubbles with hairline cyber-borders: sent gets the pale
              // electric-cyan tint, received stays white glass (DESIGN.md).
              backgroundColor: isSent
                ? "rgba(0, 242, 255, 0.12)"
                : "rgba(255, 255, 255, 0.75)",
              color: "text.primary",
              border: isSent
                ? "1px solid rgba(0, 105, 111, 0.12)"
                : "1px solid rgba(0, 105, 111, 0.08)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
              backdropFilter: "blur(10px)",
              borderRadius: bubbleRadius,
              px: 2,
              py: 1.25,
              width: "fit-content",
              maxWidth: "75%",
              minWidth: 0,
              // Dark mode: glass bubbles over the deep-space wallpaper — sent
              // gets a faint cyan tint and border, received a neutral glass.
              ...theme.applyStyles("dark", {
                backgroundColor: isSent
                  ? "rgba(0, 242, 255, 0.08)"
                  : "rgba(255, 255, 255, 0.07)",
                color: "text.primary",
                boxShadow: "none",
                border: isSent
                  ? "1px solid rgba(0, 242, 255, 0.18)"
                  : "1px solid rgba(255, 255, 255, 0.10)",
                backdropFilter: "blur(10px)",
              }),
            }
      }
    >
      <MessageContent
        content={displayText}
        contentHtml={rich ? message.contentHtml : undefined}
      />
      <AttachmentList
        attachments={attachments}
        editable={false}
        onDownload={
          onDownloadAttachment
            ? (att) => onDownloadAttachment(message.sourceThreadId, att.id, att.name)
            : undefined
        }
        onPreview={onFetchAttachment ? handlePreview : undefined}
      />
      <MessageMeta
        timestamp={message.timestamp}
        isRead={message.isRead}
        isSent={isSent}
      />
      <AttachmentViewer
        open={!!preview}
        onClose={closePreview}
        url={preview?.url}
        mimeType={preview?.mimeType || ""}
        filename={preview?.name || "attachment"}
        loading={!!preview?.loading}
        error={preview?.error}
        onDownload={
          onDownloadAttachment && preview
            ? () => onDownloadAttachment(message.sourceThreadId, preview.id, preview.name)
            : null
        }
      />
    </Box>
  );
};

export default MessageBubble;
