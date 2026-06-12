import { useState } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import EditIcon from '@mui/icons-material/Edit'
import MenuIcon from '@mui/icons-material/Menu'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import ManageGameView from './components/ManageGameView'
import PlayGameView from './components/PlayGameView'

const DRAWER_WIDTH = 240

type AppView = 'play' | 'manage'

function App() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [view, setView] = useState<AppView>('play')
  const [boardRevision, setBoardRevision] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNavigate = (nextView: AppView) => {
    setView(nextView)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const drawerContent = (
    <>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" color="secondary">
          Jeopardy
        </Typography>
      </Toolbar>
      <List component="nav" aria-label="Main navigation">
        <ListItemButton
          selected={view === 'play'}
          onClick={() => handleNavigate('play')}
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
          onClick={() => handleNavigate('manage')}
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
    </>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box
        component="nav"
        aria-label="App navigation"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
              },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          bgcolor: 'background.default',
          minHeight: '100vh',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        {isMobile ? (
          <Toolbar disableGutters sx={{ minHeight: 48, mb: 2 }}>
            <IconButton
              color="secondary"
              edge="start"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" color="secondary">
              {view === 'play' ? 'Play Game' : 'Manage Game'}
            </Typography>
          </Toolbar>
        ) : null}

        {view === 'play' ? (
          <PlayGameView key={boardRevision} boardRevision={boardRevision} />
        ) : (
          <ManageGameView onBoardSaved={() => setBoardRevision((n) => n + 1)} />
        )}
      </Box>
    </Box>
  )
}

export default App
