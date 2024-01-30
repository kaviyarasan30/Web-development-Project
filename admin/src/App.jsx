import Navbar from "./Components/Navbar/Navbar";
import Admin from './Pages/Admin/Admin';

// No need to import React explicitly in functional components with React 17 and later.
const App = () => {
  return (
    <div>
      <Navbar/>
      <Admin/>
    </div>
  );
};

export default App;
