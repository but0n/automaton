import Xorshift from './modules/xorshift';

const xorshift = new Xorshift();

const smoothstep = ( _a, _b, _k ) => {
  const smooth = _k * _k * ( 3.0 - 2.0 * _k );
  return _a + ( _b - _a ) * smooth;
};

export default [ 'noise', {
  name: 'Fractal Noise',
  params: {
    recursion: { name: 'Recursion', type: 'int', default: 4, min: 1, max: 99 },
    freq: { name: 'Frequency', type: 'float', default: 1.0, min: 0.0 },
    reso: { name: 'Resolution', type: 'float', default: 8.0, min: 1.0 },
    seed: { name: 'Seed', type: 'int', default: 1, min: 0 },
    amp: { name: 'Amp', type: 'float', default: 0.2 }
  },
  func( context ) {
    if ( context.init ) {
      xorshift.gen( context.params.seed );

      context.table = new Float32Array( Math.floor( context.params.reso ) + 2 );
      for ( let i = 1; i < context.params.reso; i ++ ) {
        context.table[ i ] = xorshift.gen() * 2.0 - 1.0;
      }
    }

    let v = context.v;
    const p = context.progress;

    for ( let i = 0; i < context.params.recursion; i ++ ) {
      const index = ( p * context.params.freq * context.params.reso * Math.pow( 2.0, i ) ) % context.params.reso;
      const indexi = Math.floor( index );
      const indexf = index - indexi;
      const factor = Math.pow( 0.5, i + 1.0 );

      v += context.params.amp * factor * smoothstep(
        context.table[ indexi ],
        context.table[ indexi + 1 ],
        indexf
      );
    }
    return v;
  }
} ];