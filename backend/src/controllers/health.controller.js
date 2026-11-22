export function getHealth(req, res) {
  res.status(200).json({
    success: true,
    message: 'Smart Tourist Safety API is running',
    timestamp: new Date().toISOString(),
  });
}
