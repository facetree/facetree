import React, { Component } from 'react';
import logo from './logo.svg';
import axios from 'axios';
import facetree from './facetree'
import './App.css';
import Chart from './Chart'
import Login from './Login'
import { Button, CircularProgress, Grid, Typography } from '@mui/material'
import { ThemeProvider, StyledEngineProvider, createTheme } from '@mui/material/styles';

import makeStyles from '@mui/styles/makeStyles';

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
      //loading: true,
      treeMode: 'Edged',
      animate: false,
      rotation: 0,
      scale: 1.5,
      x: 0,
      y: 0,
      auth: null,
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
      console.log('logged in')
      facetree.database_updater(response.data.token, updated_records => {
        const treeData = parseTree(facetree.database)
        this.setState({
          treeData,
          loading: false,
        })
      });
    }).catch((error) => {
      console.error(error);
    });
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
    const { treeData, treeMode, animate, loading, auth, rotation, scale, x, y } = this.state
    return (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          {!auth && (
            <Login onSubmit={this.login} />
          )}
          {loading && <CircularProgress />}
          {auth && treeData && (
            <Grid container>
              <Grid item xs={3} style={{backgroundColor: "#eaeaea"}}>
                <Typography variant="h3" gutterBottom>Facetree</Typography>
                <div>
                  <Typography>
                    Utseende
                  </Typography>
                  <Button onClick={() => this.setState({treeMode: 'Edged'})}>Edged</Button>
                  <Button onClick={() => this.setState({treeMode: 'Smooth'})}>Smooth</Button>
                </div>
                <div>
                  <Typography>
                    Rotation
                  </Typography>
                <Button onClick={() => this.setState({rotation: rotation + 10})}>+10</Button>
                <Button onClick={() => this.setState({rotation: rotation - 10})}>-10</Button>
                </div>
                <div>
                  <Typography>
                    Zoom
                  </Typography>
                  <Button onClick={() => this.setState({scale: scale + 0.3})}>+</Button>
                  <Button onClick={() => this.setState({scale: scale - 0.3})}>-</Button>
                </div>
                <div>
                  <Button onClick={() => this.setState(state => ({animate: !animate}))}>Animate</Button>
                </div>
              </Grid>
              <Grid item xs={9}>
                <Chart data={treeData} mode={treeMode} animate={animate} rotation={rotation} scale={scale} x={x} y={y} onZoom={({k, x, y}) => this.setState({scale: k, x, y})}/>
              </Grid>
            </Grid>
          )}
        </ThemeProvider>
      </StyledEngineProvider>
    );
  }
}

export default App;
