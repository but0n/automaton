export default [ 'gravity', {
  name: 'Gravity',
  description: 'Accelerate and bounce the curve.',
  params: {
    a: { name: 'Acceleration', type: 'float', default: 9.8 },
    e: { name: 'Restitution', type: 'float', default: 0.5, min: 0.0 },
    preserve: { name: 'Preserve Velocity', type: 'boolean', default: false }
  },
  func( context ) {
    const dt = context.dt;
    const v = context.v;

    if ( context.init ) {
      context.pos = v;
      if ( context.params.preserve ) {
        const dv = v - context.getValue( context.t - dt );
        context.vel = dv / dt;
      } else {
        context.vel = 0.0;
      }
    }

    const a = Math.sign( v - context.pos ) * context.params.a;
    context.vel += a * dt;
    context.pos += context.vel * dt;

    if ( Math.sign( a ) !== Math.sign( v - context.pos ) ) {
      context.vel *= -context.params.e;
      context.pos = v + context.params.e * ( v - context.pos );
    }

    return context.pos;
  }
} ];