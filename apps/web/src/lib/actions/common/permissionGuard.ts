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
  ALL_PERMISSIONS,
  PERMISSIONS,
  type Permission,
} from '@/lib/authz/permissions';
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

export function requireFullAccessPermission(session: Session): void {
  const auth = getAuthorization(session);
  if (!ALL_PERMISSIONS.every((permission) => auth.permissions.includes(permission))) {
    throw new Error('Você não tem permissão de acesso total para esta ação.');
  }
}

function hasAnyPermission(
  session: Session,
  requiredPermissions: readonly Permission[],
): boolean {
  const auth = getAuthorization(session);
  return requiredPermissions.some((permission) =>
    auth.permissions.includes(permission),
  );
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

function assertAnyPermission(
  session: Session,
  requiredPermissions: readonly Permission[],
  message: string,
): void {
  if (!hasAnyPermission(session, requiredPermissions)) {
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

export function requireContractLookupPermission(session: Session): void {
  assertAnyPermission(
    session,
    [
      PERMISSIONS.CONTRATOS_VIEW,
      PERMISSIONS.CONTRATOS_CREATE,
      PERMISSIONS.CONTRATOS_UPDATE,
      PERMISSIONS.CONTRATOS_DELETE,
      PERMISSIONS.VEICULOS_VIEW,
      PERMISSIONS.VEICULOS_CREATE,
      PERMISSIONS.VEICULOS_UPDATE,
      PERMISSIONS.VEICULOS_DELETE,
      PERMISSIONS.EQUIPES_VIEW,
      PERMISSIONS.EQUIPES_CREATE,
      PERMISSIONS.EQUIPES_UPDATE,
      PERMISSIONS.EQUIPES_DELETE,
      PERMISSIONS.ELETRICISTAS_VIEW,
      PERMISSIONS.ELETRICISTAS_CREATE,
      PERMISSIONS.ELETRICISTAS_UPDATE,
      PERMISSIONS.ELETRICISTAS_DELETE,
      PERMISSIONS.BASES_VIEW,
      PERMISSIONS.SUPERVISORES_VIEW,
      PERMISSIONS.TIPOS_ATIVIDADE_VIEW,
      PERMISSIONS.FORMULARIOS_ATIVIDADE_VIEW,
      PERMISSIONS.FORMULARIOS_ATIVIDADE_PERGUNTA_VIEW,
      PERMISSIONS.MATERIAIS_CATALOGO_VIEW,
      PERMISSIONS.MOBILE_USERS_VIEW,
      PERMISSIONS.MOBILE_USERS_CREATE,
      PERMISSIONS.MOBILE_USERS_UPDATE,
      PERMISSIONS.MOBILE_USERS_DELETE,
      PERMISSIONS.REPORTS_VIEW,
    ],
    'Você não tem permissão para consultar contratos.',
  );
}

export function requireBasesPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.BASES_VIEW],
    'Você não tem permissão para acessar bases.',
  );
}

export function requireCargosPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.CARGOS_VIEW],
    'Você não tem permissão para acessar cargos.',
  );
}

export function requireSupervisoresPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.SUPERVISORES_VIEW],
    'Você não tem permissão para acessar supervisores.',
  );
}

export function requireTiposJustificativaPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.TIPOS_JUSTIFICATIVA_VIEW],
    'Você não tem permissão para acessar tipos de justificativa.',
  );
}

export function requireTiposAtividadePermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.TIPOS_ATIVIDADE_VIEW],
    'Você não tem permissão para acessar tipos de atividade.',
  );
}

export function requireSubtiposAtividadePermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.SUBTIPOS_ATIVIDADE_VIEW],
    'Você não tem permissão para acessar subtipos de atividade.',
  );
}

export function requireTiposChecklistPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.CHECKLIST_TIPOS_VIEW],
    'Você não tem permissão para acessar tipos de checklist.',
  );
}

export function requireTiposEquipePermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.TIPOS_EQUIPE_VIEW],
    'Você não tem permissão para acessar tipos de equipe.',
  );
}

export function requireTiposVeiculoPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.TIPOS_VEICULO_VIEW],
    'Você não tem permissão para acessar tipos de veículo.',
  );
}

export function requireMateriaisCatalogoPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.MATERIAIS_CATALOGO_VIEW],
    'Você não tem permissão para acessar materiais de catálogo.',
  );
}

export function requireCausasImprodutivasPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.CAUSAS_IMPRODUTIVAS_VIEW],
    'Você não tem permissão para acessar causas improdutivas.',
  );
}

export function requireFormulariosAtividadePermission(
  session: Session,
): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.FORMULARIOS_ATIVIDADE_VIEW],
    'Você não tem permissão para acessar formulários de atividade.',
  );
}

export function requireFormulariosAtividadePerguntaPermission(
  session: Session,
): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.FORMULARIOS_ATIVIDADE_PERGUNTA_VIEW],
    'Você não tem permissão para acessar perguntas de formulários.',
  );
}

export function requireAprPerguntasPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.APR_PERGUNTAS_VIEW],
    'Você não tem permissão para acessar perguntas APR.',
  );
}

export function requireAprOpcoesPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.APR_OPCOES_VIEW],
    'Você não tem permissão para acessar opções APR.',
  );
}

export function requireAprGruposPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.APR_GRUPOS_VIEW],
    'Você não tem permissão para acessar grupos APR.',
  );
}

export function requireAprModelosPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.APR_MODELOS_VIEW],
    'Você não tem permissão para acessar modelos APR.',
  );
}

export function requireChecklistPerguntasPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.CHECKLIST_PERGUNTAS_VIEW],
    'Você não tem permissão para acessar perguntas de checklist.',
  );
}

export function requireChecklistOpcoesPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.CHECKLIST_OPCOES_VIEW],
    'Você não tem permissão para acessar opções de checklist.',
  );
}

export function requireChecklistModelosPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.CHECKLIST_MODELOS_VIEW],
    'Você não tem permissão para acessar modelos de checklist.',
  );
}

export function requireActivitiesPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.ACTIVITIES_VIEW],
    'Você não tem permissão para acessar atividades.',
  );
}

export function requireShiftsPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.SHIFTS_VIEW],
    'Você não tem permissão para acessar turnos.',
  );
}

export function requireShiftsOrAttendancePermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.SHIFTS_VIEW, PERMISSIONS.ATTENDANCE_VIEW],
    'Você não tem permissão para acessar dados de turnos.',
  );
}

export function requireAttendancePermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.ATTENDANCE_VIEW],
    'Você não tem permissão para acessar frequência.',
  );
}

export function requireTurnoRealizadoPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.REPORTS_VIEW],
    'Você não tem permissão para acessar dados consolidados de frequência.',
  );
}

export function requireSchedulesPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.SCHEDULES_VIEW, PERMISSIONS.ESCALAS_VIEW],
    'Você não tem permissão para acessar escalas.',
  );
}

export function requireEscalasCreatePermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.ESCALAS_CREATE],
    'Você não tem permissão para criar escalas.',
  );
}

export function requireEscalasUpdatePermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.ESCALAS_UPDATE],
    'Você não tem permissão para editar escalas.',
  );
}

export function requireEscalasDeletePermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.ESCALAS_DELETE],
    'Você não tem permissão para excluir escalas.',
  );
}

export function requireEscalasPublishPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.ESCALAS_PUBLISH],
    'Você não tem permissão para publicar escalas.',
  );
}

export function requireSafetyPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.SAFETY_VIEW],
    'Você não tem permissão para acessar segurança.',
  );
}

export function requireReportsPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.REPORTS_VIEW, PERMISSIONS.RELATORIO_VIEW],
    'Você não tem permissão para acessar relatórios.',
  );
}

export function requireTiposEscalaPermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.TIPOS_ESCALA_VIEW],
    'Você não tem permissão para acessar tipos de escala.',
  );
}

export function requireHorariosEquipePermission(session: Session): void {
  assertAnyPermission(
    session,
    [PERMISSIONS.HORARIOS_EQUIPE_VIEW],
    'Você não tem permissão para acessar o catálogo de horários.',
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
