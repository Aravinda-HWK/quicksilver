import React from "react";
import { Box, IconButton as MuiIconButton, Avatar, Typography, useMediaQuery, useTheme } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { getInitials, getAvatarColor } from "../_constants/avatarUtils";
import ParticipantList from "../atoms/ParticipantList";
import ThreadActions from "./ThreadActions";

const ThreadHeader = ({ thread, onAction = null, onForward = null }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const participantName = thread?.participants?.[0]?.name || "Unknown";

  return (
    <Box
      sx={(muiTheme) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.25,
        borderBottom: 1,
        borderColor: "divider",
        // Translucent glass strip over the pane surface in both schemes.
        backgroundColor: "rgba(255, 255, 255, 0.4)",
        backdropFilter: "blur(12px)",
        ...muiTheme.applyStyles("dark", {
          backgroundColor: "rgba(255, 255, 255, 0.04)",
        }),
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        {!isDesktop && (
          <MuiIconButton aria-label="back" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </MuiIconButton>
        )}
        <Avatar sx={{ width: 40, height: 40, ...getAvatarColor(participantName) }}>
          {getInitials(participantName)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{ lineHeight: 1.3, letterSpacing: "-0.01em" }}
          >
            {thread?.subject || participantName}
          </Typography>
          <ParticipantList participants={thread?.participants || []} />
        </Box>
      </Box>
      <ThreadActions threadId={thread?.id} onAction={onAction} onForward={onForward} />
    </Box>
  );
};

export default ThreadHeader;
