import { useState } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import EditIcon from '@mui/icons-material/Edit'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import ManageGameView from './components/ManageGameView'
import PlayGameView from './components/PlayGameView'

const DRAWER_WIDTH = 240

type AppView = 'play' | 'manage'

function App() {
  const [view, setView] = useState<AppView>('play')
  const [boardRevision, setBoardRevision] = useState(0)

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
        {view === 'play' ? (
          <PlayGameView boardRevision={boardRevision} />
        ) : (
          <ManageGameView onBoardSaved={() => setBoardRevision((n) => n + 1)} />
        )}
      </Box>
    </Box>
  )
}

export default App
