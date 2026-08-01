function Comment({ userInput }) {
  document.getElementById("output").textContent = userInput;
  return <div>{userInput}</div>;
}
