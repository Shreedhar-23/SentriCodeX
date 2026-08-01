function Comment({ userInput }) {
  document.getElementById("output").innerHTML = userInput;
  return <div dangerouslySetInnerHTML={{ __html: userInput }} />;
}
