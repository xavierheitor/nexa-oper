import type { Session } from 'next-auth';
import {
  canCreateContracts,
  canCreateElectricians,
  canCreateMobileUsers,
  canCreateTeams,
  canCreateVehicles,
  canDeleteContracts,
  canDeleteElectricians,
  canDeleteMobileUsers,
  canDeleteTeams,
  canDeleteVehicles,
  canManageMobileUserPermissions,
  canResetMobileUserPasswords,
  canUpdateContracts,
  canUpdateElectricians,
  canUpdateMobileUsers,
  canUpdateTeams,
  canUpdateVehicles,
  canViewContracts,
  canViewElectricians,
  canViewMobileUsers,
  canViewTeams,
  canViewVehicles,
} from '@/lib/authz/registry-access';
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

function assertPermission(
  session: Session,
  predicate: (roles: Session['user']['roles'], permissions: Session['user']['permissions']) => boolean,
  message: string,
): void {
  const auth = getAuthorization(session);
  if (!predicate(auth.roles, auth.permissions)) {
    throw new Error(message);
  }
}

export function requireViewUsersPermission(session: Session): void {
  assertPermission(
    session,
    canViewUsers,
    'Você não tem permissão para visualizar usuários.',
  );
}

export function requireCreateUsersPermission(session: Session): void {
  assertPermission(
    session,
    canCreateUsers,
    'Você não tem permissão para criar usuários.',
  );
}

export function requireUpdateUsersPermission(session: Session): void {
  assertPermission(
    session,
    canUpdateUsers,
    'Você não tem permissão para editar usuários.',
  );
}

export function requireDeleteUsersPermission(session: Session): void {
  assertPermission(
    session,
    canDeleteUsers,
    'Você não tem permissão para excluir usuários.',
  );
}

export function requireResetUserPasswordPermission(session: Session): void {
  assertPermission(
    session,
    canResetUserPasswords,
    'Você não tem permissão para resetar senhas.',
  );
}

export function requireManageUserPermissions(session: Session): void {
  assertPermission(
    session,
    canManageUserPermissions,
    'Você não tem permissão para gerenciar permissões.',
  );
}

export function requireViewContractsPermission(session: Session): void {
  assertPermission(
    session,
    canViewContracts,
    'Você não tem permissão para visualizar contratos.',
  );
}

export function requireCreateContractsPermission(session: Session): void {
  assertPermission(
    session,
    canCreateContracts,
    'Você não tem permissão para criar contratos.',
  );
}

export function requireUpdateContractsPermission(session: Session): void {
  assertPermission(
    session,
    canUpdateContracts,
    'Você não tem permissão para editar contratos.',
  );
}

export function requireDeleteContractsPermission(session: Session): void {
  assertPermission(
    session,
    canDeleteContracts,
    'Você não tem permissão para excluir contratos.',
  );
}

export function requireViewVehiclesPermission(session: Session): void {
  assertPermission(
    session,
    canViewVehicles,
    'Você não tem permissão para visualizar veículos.',
  );
}

export function requireCreateVehiclesPermission(session: Session): void {
  assertPermission(
    session,
    canCreateVehicles,
    'Você não tem permissão para criar veículos.',
  );
}

export function requireUpdateVehiclesPermission(session: Session): void {
  assertPermission(
    session,
    canUpdateVehicles,
    'Você não tem permissão para editar veículos.',
  );
}

export function requireDeleteVehiclesPermission(session: Session): void {
  assertPermission(
    session,
    canDeleteVehicles,
    'Você não tem permissão para excluir veículos.',
  );
}

export function requireViewTeamsPermission(session: Session): void {
  assertPermission(
    session,
    canViewTeams,
    'Você não tem permissão para visualizar equipes.',
  );
}

export function requireCreateTeamsPermission(session: Session): void {
  assertPermission(
    session,
    canCreateTeams,
    'Você não tem permissão para criar equipes.',
  );
}

export function requireUpdateTeamsPermission(session: Session): void {
  assertPermission(
    session,
    canUpdateTeams,
    'Você não tem permissão para editar equipes.',
  );
}

export function requireDeleteTeamsPermission(session: Session): void {
  assertPermission(
    session,
    canDeleteTeams,
    'Você não tem permissão para excluir equipes.',
  );
}

export function requireViewElectriciansPermission(session: Session): void {
  assertPermission(
    session,
    canViewElectricians,
    'Você não tem permissão para visualizar eletricistas.',
  );
}

export function requireCreateElectriciansPermission(session: Session): void {
  assertPermission(
    session,
    canCreateElectricians,
    'Você não tem permissão para criar eletricistas.',
  );
}

export function requireUpdateElectriciansPermission(session: Session): void {
  assertPermission(
    session,
    canUpdateElectricians,
    'Você não tem permissão para editar eletricistas.',
  );
}

export function requireDeleteElectriciansPermission(session: Session): void {
  assertPermission(
    session,
    canDeleteElectricians,
    'Você não tem permissão para excluir eletricistas.',
  );
}

export function requireViewMobileUsersPermission(session: Session): void {
  assertPermission(
    session,
    canViewMobileUsers,
    'Você não tem permissão para visualizar usuários móveis.',
  );
}

export function requireCreateMobileUsersPermission(session: Session): void {
  assertPermission(
    session,
    canCreateMobileUsers,
    'Você não tem permissão para criar usuários móveis.',
  );
}

export function requireUpdateMobileUsersPermission(session: Session): void {
  assertPermission(
    session,
    canUpdateMobileUsers,
    'Você não tem permissão para editar usuários móveis.',
  );
}

export function requireDeleteMobileUsersPermission(session: Session): void {
  assertPermission(
    session,
    canDeleteMobileUsers,
    'Você não tem permissão para excluir usuários móveis.',
  );
}

export function requireManageMobileUserPermissions(session: Session): void {
  assertPermission(
    session,
    canManageMobileUserPermissions,
    'Você não tem permissão para gerenciar permissões de usuários móveis.',
  );
}

export function requireResetMobileUserPasswordPermission(
  session: Session,
): void {
  assertPermission(
    session,
    canResetMobileUserPasswords,
    'Você não tem permissão para resetar senhas de usuários móveis.',
  );
}
