/**
 * Render layer reserved for the product light rig.
 *
 * The can is moved onto this layer and the rig's lights are restricted to it,
 * so the key light can be strong enough to reveal the aluminium in a dark
 * chapter without also lifting the asteroid field or the station ring. The
 * environment keeps exactly the lighting it had before the rig existed.
 *
 * The camera has to be told to render the layer as well — see SceneController.
 */
export const PRODUCT_LAYER = 2;
