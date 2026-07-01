export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Error de validación', errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'campo';
    return res.status(409).json({ message: `El ${field} ya está registrado` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'ID inválido' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
  });
}

export function notFound(req, res) {
  res.status(404).json({ message: 'Ruta no encontrada' });
}
