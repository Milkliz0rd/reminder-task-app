// This file is only the server starter

const app = require("./src/app");
const PORT = 3000;

app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server is listening on Port ", PORT);
});
