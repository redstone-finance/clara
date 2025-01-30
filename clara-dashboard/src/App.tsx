import type {Component} from "solid-js";
import {Route, Router} from "@solidjs/router";
import {Navbar} from "./components/Navbar";
import {AgentsPage} from "./pages/AgentsPage";
import {AgentDetailsPage} from "./pages/AgentDetailsPages";
import {TasksPage} from "./pages/TasksPage";
import {TaskDetailsPage} from "./pages/TaskDetailsPage";


const Layout = (props: any) => {
    return (
        <>
            <Navbar/>
            <div class="container">{props.children}</div>
            <footer></footer>
        </>
    );
};

const App: Component = () => {
    return (
        <Router root={Layout}>
            <Route path="/" component={AgentsPage}/>
            <Route path="/agents" component={AgentsPage}/>
            <Route path="/agents/:id" component={AgentDetailsPage}/>
            <Route path="/tasks" component={TasksPage}/>
            <Route path="/tasks/:id" component={TaskDetailsPage}/>
        </Router>
    );
};

export default App;
