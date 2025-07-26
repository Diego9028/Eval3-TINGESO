import { useState } from "react";

import AppBar      from "@mui/material/AppBar";
import Box         from "@mui/material/Box";
import Toolbar     from "@mui/material/Toolbar";
import Typography  from "@mui/material/Typography";
import IconButton  from "@mui/material/IconButton";
import MenuIcon    from "@mui/icons-material/Menu";

import Sidemenu    from "./Sidemenu";       

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const toggleDrawer = (open) => () => setOpen(open);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            KartingRM – Gestión de Reservas
          </Typography>

        </Toolbar>
      </AppBar>

      <Sidemenu open={open} toggleDrawer={toggleDrawer} />
    </Box>
  );
}
