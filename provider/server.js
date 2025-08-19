const express = require('express');

const app = express();
app.use(express.json());

/**
 * Toy logic: different IDs -> different statuses
 * 42 => SHIPPED, 7 => CREATED, everything else => NOT_FOUND
 */
app.get('/orders/:id', (req, res) => {
  const { id } = req.params;

  if (id === '40') {
    return res.status(200).json({
      id,
      status: 'SHIPPED',
      eta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  if (id === '7') {
    return res.status(200).json({
      id,
      status: 'CREATED',
      eta: null
    });
  }

  return res.status(404).json({
    error: 'ORDER_NOT_FOUND',
    message: `Order ${id} not found`
  });
});

// only start when invoked directly
if (require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`Orders API on http://localhost:${port}`));
}

module.exports = { app };