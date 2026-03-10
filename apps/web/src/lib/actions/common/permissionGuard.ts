import type { Session } from 'next-auth';
import {
  canCreateUsers,
  canDeleteUsers,
  canManageUserPermissions,
  canResetUserPasswords,
  canUpdateUsers,
  canViewUsers,
} from '@/lib/authz/user-access';

function getAuthorization(session: Session) {
  return {
    roles: session.user.roles || [],
    permissions: session.user.permissions || [],
  };
}

export function requireViewUsersPermission(session: Session): void {
  const auth = getAuthorization(session);
  if (!canViewUsers(auth.roles, auth.permissions)) {
    throw new Error('Você não tem permissão para visualizar usuários.');
  }
}

export function requireCreateUsersPermission(session: Session): void {
  const auth = getAuthorization(session);
  if (!canCreateUsers(auth.roles, auth.permissions)) {
    throw new Error('Você não tem permissão para criar usuários.');
  }
}

export function requireUpdateUsersPermission(session: Session): void {
  const auth = getAuthorization(session);
  if (!canUpdateUsers(auth.roles, auth.permissions)) {
    throw new Error('Você não tem permissão para editar usuários.');
  }
}

export function requireDeleteUsersPermission(session: Session): void {
  const auth = getAuthorization(session);
  if (!canDeleteUsers(auth.roles, auth.permissions)) {
    throw new Error('Você não tem permissão para excluir usuários.');
  }
}

export function requireResetUserPasswordPermission(session: Session): void {
  const auth = getAuthorization(session);
  if (!canResetUserPasswords(auth.roles, auth.permissions)) {
    throw new Error('Você não tem permissão para resetar senhas.');
  }
}

export function requireManageUserPermissions(session: Session): void {
  const auth = getAuthorization(session);
  if (!canManageUserPermissions(auth.roles, auth.permissions)) {
    throw new Error('Você não tem permissão para gerenciar permissões.');
  }
}
