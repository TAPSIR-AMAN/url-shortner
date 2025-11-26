
import { relations } from 'drizzle-orm';
import { int, mysqlTable, varchar,timestamp } from 'drizzle-orm/mysql-core';

export const shortLink = mysqlTable('short_link', {
  id: int().autoincrement().primaryKey(),
  url: varchar({ length: 255 }).notNull(),
  shortCode: varchar("short_code",{ length: 25 }).notNull().unique(),
  createdAt:timestamp("created_at").defaultNow().notNull(),
  updatedAt:timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  userId:int("user_id").notNull().references(()=>usersTable.id)

});
export const usersTable = mysqlTable('users', {
  id: int().autoincrement().primaryKey(),
  name:varchar({length:255}).notNull(),
  email:varchar({length:255}).notNull().unique(),
  password:varchar({length:255}).notNull(),
  createdAt:timestamp("created_at").defaultNow().notNull(),
  updatedAt:timestamp("updated_at").defaultNow().onUpdateNow().notNull()

});


export const usersRelation=relations(usersTable,({many})=>({
  shortLink:many(shortLink)
}))
export const shortLinkRelation=relations(shortLink,({one})=>({
  user:one(usersTable,{
    fields:[shortLink.userId],
    references:[usersTable.id],
  })
}))
