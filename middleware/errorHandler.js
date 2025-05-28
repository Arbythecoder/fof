module.exports = (err, req, res, next) => {
  console.error('ERROR 💥', err);

  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Something went wrong!',
  });
};
