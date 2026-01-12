const express = require('express');
const cors = require('cors');
require('dotenv').config();
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const db = require('./config/db'); // ejecuta la conexión
const hourRoutes = require('./routes/hours');
const catalogRoutes = require('./routes/catalog');
const parametroRoutes = require('./routes/parametros');
const reportesRoutes = require('./routes/reportes');
const dashboardRoutes = require('./routes/dashboard');
const projectsRoutes = require('./routes/projects');
const vacationsRoutes = require('./routes/vacations');
const attendanceRoutes = require('./routes/attendance_remoto');

const app = express();
app.use(cors({
  origin: ['https://v0-invoke-registro-horas-bs.vercel.app']   // o el dominio donde sirvas tu frontend
}));
app.use(express.json());


// Rutas
app.use('/api/users', userRoutes);
app.use('/api/users', authRoutes);
app.use('/api/hours', hourRoutes);
app.use('/api', catalogRoutes);
app.use('/api/parametros', parametroRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/vacations', vacationsRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/', (req, res) => {
  res.send('Backend funcionando correctamente');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
