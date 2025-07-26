import { Link } from "react-router-dom";
import Drawer from "@mui/material/Drawer";
import List   from "@mui/material/List";
import ListItem       from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText   from "@mui/material/ListItemText";

export default function Sidemenu({ open, toggleDrawer }) {
  return (
    <Drawer anchor="left" open={open} onClose={toggleDrawer(false)}>
      <List sx={{ width: 240 }} onClick={toggleDrawer(false)}>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/">
            <ListItemText primary="Inicio" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={Link} to="/register">
            <ListItemText primary="Registro" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={Link} to="/reservas">
            <ListItemText primary="Nueva reserva" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={Link} to="/rack">
            <ListItemText primary="Rack semanal" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={Link} to="/reportes">
            <ListItemText primary="Reportes" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
}
