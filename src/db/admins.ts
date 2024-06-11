import { getCRDTMessages, handleCRDTMessages, toMessages } from '@/db/helpers';
import { queueExec } from '@/db/db';
import { isDeepEqual } from 'remeda';
import type { Optional } from 'utility-types';
import type { Admin, AdminFull } from '@/domain/admins';

export type AdminInsert = Pick<Admin, 'id' | 'name' | 'eventId'>;
export type AdminUpdate = Pick<Admin, 'id'> & Optional<Pick<Admin, 'name' | 'tombstone'>>;

export const insertAdmin = async (adminInsert: AdminInsert, actor: string): Promise<boolean> => {
  const messages = toMessages('admins', adminInsert, adminInsert.eventId, actor);
  await handleCRDTMessages(messages);
  return true;
};

export const updateAdmin = async (adminUpsert: AdminUpdate, actor: string): Promise<boolean> => {
  const existingAdmin = await getAdmin(adminUpsert.id);
  let adminCopy: AdminUpdate = { id: adminUpsert.id };
  if (existingAdmin) {
    Object.keys(adminUpsert).forEach((key) => {
      const newValue = adminUpsert[key as keyof AdminUpdate];
      const existingValue = existingAdmin[key as keyof AdminUpdate];
      if (!isDeepEqual<any, any>(newValue, existingValue)) {
        adminCopy[key as keyof AdminUpdate] = newValue;
      }
    });
    if (Object.keys(adminCopy).length <= 1) {
      // 1 for the id
      return false;
    }
  } else {
    adminCopy = adminUpsert;
  }

  const messages = toMessages('admins', adminCopy, adminCopy.id, actor);
  await handleCRDTMessages(messages);
  return true;
};

export const getAdmins = async (eventId: string): Promise<Admin[]> => {
  const eventSQL = `
      SELECT admins.*
      FROM admins
      WHERE admins.eventId = ?
  `;
  const res = await queueExec((execer) => execer(eventSQL, [eventId]));
  return (res.result?.resultRows as Admin[]) || [];
};

export const getAdmin = async (id: string): Promise<AdminFull | null> => {
  const eventSQL = `
      SELECT admins.*
      FROM admins
      WHERE admins.id = ?
  `;
  const res = await queueExec((execer) => execer(eventSQL, [id]));
  if (!res.result) {
    return null;
  }
  const admin = res.result.resultRows[0] as Admin;
  const history = await getCRDTMessages('admins', id);
  return { ...admin, history };
};

export const getMultipleAdmins = async (ids: string[]): Promise<Record<string, Admin>> => {
  const eventSQL = `
      SELECT admins.*
      FROM admins
      WHERE admins.id IN (${ids.map(() => '?').join(',')})
  `;
  const res = await queueExec((execer) => execer(eventSQL, [ids]));
  if (!res.result) {
    return {};
  }
  const admin = res.result.resultRows as Admin[];
  return admin.reduce(
    (acc, admin) => {
      acc[admin.id] = admin;
      return acc;
    },
    {} as Record<string, Admin>,
  );
};
