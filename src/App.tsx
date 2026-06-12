import { useState } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import EditIcon from '@mui/icons-material/Edit'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'

const DRAWER_WIDTH = 240

type AppView = 'play' | 'manage'

function PlayGamePlaceholder() {
  return (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" color="secondary" gutterBottom>
        Play Game
      </Typography>
      <Typography color="text.secondary">
        Game setup and board will appear here.
      </Typography>
    </Paper>
  )
}

function ManageGamePlaceholder() {
  return (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" color="secondary" gutterBottom>
        Manage Game
      </Typography>
      <Typography color="text.secondary">
        Board editor will appear here.
      </Typography>
    </Paper>
  )
}

function App() {
  const [view, setView] = useState<AppView>('play')

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" color="secondary">
            Jeopardy
          </Typography>
        </Toolbar>
        <List component="nav" aria-label="Main navigation">
          <ListItemButton
            selected={view === 'play'}
            onClick={() => setView('play')}
          >
            <ListItemIcon
              sx={{
                color: view === 'play' ? 'secondary.main' : 'inherit',
              }}
            >
              <SportsEsportsIcon />
            </ListItemIcon>
            <ListItemText primary="Play Game" />
          </ListItemButton>
          <ListItemButton
            selected={view === 'manage'}
            onClick={() => setView('manage')}
          >
            <ListItemIcon
              sx={{
                color: view === 'manage' ? 'secondary.main' : 'inherit',
              }}
            >
              <EditIcon />
            </ListItemIcon>
            <ListItemText primary="Manage Game" />
          </ListItemButton>
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {view === 'play' ? <PlayGamePlaceholder /> : <ManageGamePlaceholder />}
      </Box>
    </Box>
  )
}

export default App
