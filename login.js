
// ---------------------js for verification------------

let input_pwd;
let verify = document.getElementById("verification");



verify.addEventListener("submit", async (e) => {
  e.preventDefault();
  input_pwd = String(e.target.password.value);
  window.location = `main.html?input-pwd=${input_pwd}`;

});