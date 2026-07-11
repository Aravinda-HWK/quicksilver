import React from "react";
import { Box, Avatar, Typography } from "@mui/material";
import { getInitials, getAvatarColor } from "../_constants/avatarUtils";
import MessageBubble from "./MessageBubble";
import { useAccount } from "../../nonview/core/AccountContext";

const MessageGroup = ({
  messages = [],
  sender,
  onDownloadAttachment,
  onFetchAttachment,
}) => {
  const { activeAccount } = useAccount();

  if (!messages.length) return null;

  const isSent = sender?.id === "current" || (activeAccount?.email && sender?.email === activeAccount?.email);
  const senderName = sender?.name || "Unknown";

  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 2, alignItems: "flex-end" }}>
      {!isSent && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            fontSize: "0.8125rem",
            mb: 2.5, // keep the avatar level with the last bubble, above its meta row
            ...getAvatarColor(senderName),
          }}
        >
          {getInitials(senderName)}
        </Avatar>
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "4px", // group-gap: sequential messages from one sender fuse tightly
          flex: 1,
          minWidth: 0,
        }}
      >
        {!isSent && (
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontWeight: 600, ml: 1, mb: 0.25 }}
          >
            {senderName}
          </Typography>
        )}
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isSent={isSent}
            isFirstInGroup={index === 0}
            isLastInGroup={index === messages.length - 1}
            onDownloadAttachment={onDownloadAttachment}
            onFetchAttachment={onFetchAttachment}
          />
        ))}
      </Box>
    </Box>
  );
};

export default MessageGroup;
