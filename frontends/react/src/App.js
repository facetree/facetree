import React, { Component } from 'react';
import logo from './logo.svg';
import axios from 'axios';
import facetree from './facetree'
import './App.css';
import Chart from './Chart'
import Login from './Login'
import { ThemeProvider, StyledEngineProvider, createTheme } from '@mui/material/styles';
import Controls from './Controls';
import { Grid } from '@mui/material';


const theme = createTheme();

const facetree_backend = 'https://facetree-dev.ardoe.net';

// test00
// hasYs56
const database = facetree.database

const parseTree = database => {
  const tree = {
    //root: database.root
    root: buildIndividual(database.root)
  }
  return tree
}

const buildIndividual = ind => {
  if (!database.parentin[ind.id]) {
    return ind
  }
  var plist = Array.from(database.parentin[ind.id]);
  let children = []
  for (var parent in plist) {
    const childrenIdsSet = database.families[plist[parent]].children
    var childrenIds = childrenIdsSet ? Array.from(childrenIdsSet) : []
    const parentChildren = childrenIds.map(childId => database.individuals[childId])
    children.push(...parentChildren)
  }
  //ind.children = children
  //children.forEach(buildIndividual)
  return {
    ...ind,
    children: children.map(buildIndividual)
  }
}
class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      auth: localStorage.getItem("token"),
      options: {
        treeMode: 'Edged',
        animate: false,
        rotation: 0,
        scale: 1.5,
        x: 0,
        y: 0,
      }
    }
  }
  componentDidMount() {
    if (this.state.auth) {
      this.fetchData(this.state.auth).catch((error) => {
        console.error(error)
        this.setState({auth: null})
      })
    }
  }

  login = (username, password) => {
    console.log('Try to log in')
    axios.post(facetree_backend + "/v1/users/login/password", {
      "email": username,
      "password": password
    }).then(response => {
      this.setState({
        auth: response.data.token,
        loading: true,
      })
      localStorage.setItem("token", response.data.token)
      this.fetchData(response.data.token)
      console.log('logged in')
    }).catch((error) => {
      console.error(error);
    });
  }

  fetchData(token) {
    console.log("Fetching data")
    const setData = () => {
      const treeData = parseTree(facetree.database)
      this.setState({
        treeData,
        loading: false,
      })
    }
    facetree.database_updater(token, setData)
    return facetree.database_download().then(setData)
  }

  parentin = id => {
    var families = [];
    if (!facetree.database.parentin[id]) {
      return [];
    }
    var plist = Array.from(facetree.database.parentin[id]);
    for (var i in plist) {
      let fid = plist[i];
      families.push(facetree.database.families[fid]);
    }
    return families;
  }
  childin = id => {
    var families = [];
    if (!facetree.database.childin[id]) {
      return [];
    }
    var plist = Array.from(facetree.database.childin[id]);
    for (var i in plist) {
      let fid = plist[i];
      families.push(facetree.database.families[fid]);
    }
    return families;
  }
  individual = id => {
    return facetree.database.individuals[id];
  }
  show_individual = id => {
    this.image = '';
    this.curent_individual = id;
    this.mode = 'Individual';
    if (facetree.database.individuals[id].imageIds && facetree.database.individuals[id].imageIds.length > 0) {
      var imgid = facetree.database.individuals[id].imageIds[0][1];
      axios.get(facetree_backend + "/v1/images/" + imgid + "/full.jpg/base64", { "headers": facetree.auth_headers })
        .then((response) => {
          this.image = 'data:image/jpeg;base64,' + response.data;
        })
        .catch(function (error) {
          console.log("Image download failed");
          console.log(error);
        });
    }
  }
  render() {
    const { treeData, options, auth, loading } = this.state
    return (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          {!auth && (
            <Login onSubmit={this.login} />
          )}
          {auth && (
            <Grid container>
              <Grid item xs={3} style={{backgroundColor: "#eaeaea"}}>
                <Controls onChange={newOptions => this.setState({options: {...options, ...newOptions}})} options={options} />
              </Grid>
              <Grid item xs={9}>
                {loading && <LinearProgress />}
                {treeData && <Chart data={treeData} options={options} onZoom={({k, x, y}) => this.setState({options: {...options, scale: k, x, y}})}/> }
              </Grid>
            </Grid>
          )}
        </ThemeProvider>
      </StyledEngineProvider>
    );
  }
}

export default App;
