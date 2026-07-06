/**
 * Acciones registradas en `activity_log`. Convención `<entidad>.<verbo>`.
 * Se mantiene como string abierto para poder añadir nuevas sin cambiar la
 * DB; este type sólo sirve para intellisense de los sitios que loggean.
 */
export type ActivityAction =
  | 'dog.create'
  | 'dog.update'
  | 'dog.delete'
  | 'dog.destacar'
  | 'walk.log'
  | 'walk.update'
  | 'walk.delete'
  | 'auth.login'
  | 'auth.logout'
  | (string & {}); // permite valores futuros sin romper el compilador

export type ActivityEntityType = 'dog' | 'walk' | 'assignment' | 'auth' | (string & {});

/** Una entrada del historial (registro inmutable). */
export interface ActivityEntry {
  id: string;
  /** UUID del usuario auth (null si el usuario ya no existe o era anon). */
  userId?: string;
  /** Email del usuario en el momento de la acción (denormalizado). */
  userEmail?: string;
  action: ActivityAction;
  entityType?: ActivityEntityType;
  /** Id de la entidad afectada (p.ej. `R-ABC123` para perro, uuid para paseo). */
  entityId?: string;
  /** Texto legible listo para pintar en el feed. */
  summary?: string;
  /** Contexto adicional serializable (JSON). */
  metadata?: Record<string, unknown>;
  /** Timestamp ISO 8601. */
  createdAt: string;
}
