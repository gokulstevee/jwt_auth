const app = require("./App");
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("Port is up and running...", PORT);
});
