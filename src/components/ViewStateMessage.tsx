import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

export type ViewStateMessageProps = {
  title: string
  message: string
  severity?: 'error' | 'warning' | 'info'
  hint?: string
}

export default function ViewStateMessage({
  title,
  message,
  severity = 'error',
  hint,
}: ViewStateMessageProps) {
  return (
    <Paper sx={{ p: 3, maxWidth: 640 }}>
      <Typography variant="h5" color="secondary" gutterBottom>
        {title}
      </Typography>
      <Alert severity={severity} sx={{ mt: 1 }}>
        {message}
      </Alert>
      {hint ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {hint}
          </Typography>
        </Box>
      ) : null}
    </Paper>
  )
}
