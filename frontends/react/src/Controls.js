import { Component } from "react";
import { Button, CircularProgress, FormControlLabel, Grid, IconButton, LinearProgress, Slider, Stack, Switch, Typography } from '@mui/material'
import { PlusOne, RotateLeft, RotateRight, TextDecrease, TextIncrease, ZoomIn, ZoomOut } from '@mui/icons-material';

export class Controls extends Component {
  render() {
    const { rotation, treeMode, scale, animate } = this.props.options
    const callOnChange = (value) => () => this.props.onChange(value)

    return (
      <div>
        <Typography variant="h3" gutterBottom>Facetree</Typography>
        <div>
          <Typography>
            Utseende
          </Typography>

          <Button onClick={callOnChange({treeMode: "Edged"})}>Edged</Button>
          <Button onClick={callOnChange({treeMode: "Smooth"})}>Smooth</Button>
        </div>
        <div>
          <Typography>
            Rotation {rotation}°
          </Typography>
        <IconButton onClick={callOnChange({rotation: rotation - 10})}><RotateLeft/></IconButton>
        <IconButton onClick={callOnChange({rotation: rotation + 10})}><RotateRight/></IconButton>
        </div>
        <div>
          <Typography>
            Zoom {parseInt(scale*100)} %
          </Typography>
          <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
            <IconButton onClick={callOnChange({scale: scale - 0.25})} ><ZoomOut/></IconButton>
            <Slider aria-label="Zoom" min={0.5} max={8} step={0.1} value={scale} onChange={(event, scale) => this.props.onChange({scale})} />
            <IconButton onClick={callOnChange({scale: scale + 0.25})} ><ZoomIn/></IconButton>
          </Stack>
        </div>
        <div>
          <FormControlLabel control={
            <Switch checked={animate} onChange={event => this.props.onChange({ animate: event.target.checked })} />
          } label="Animate" />
        </div>
      </div>
    )
  }
}
export default Controls