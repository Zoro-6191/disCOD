import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("xlr_history_weekly", { schema: "bonk" })
export class XlrHistoryWeekly {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "client_id", unsigned: true, default: () => "'0'" })
  clientId: number;

  @Column("mediumint", { name: "kills", unsigned: true, default: () => "'0'" })
  kills: number;

  @Column("mediumint", { name: "deaths", unsigned: true, default: () => "'0'" })
  deaths: number;

  @Column("smallint", {
    name: "teamkills",
    unsigned: true,
    default: () => "'0'",
  })
  teamkills: number;

  @Column("smallint", {
    name: "teamdeaths",
    unsigned: true,
    default: () => "'0'",
  })
  teamdeaths: number;

  @Column("smallint", {
    name: "suicides",
    unsigned: true,
    default: () => "'0'",
  })
  suicides: number;

  @Column("float", { name: "ratio", precision: 12, default: () => "'0'" })
  ratio: number;

  @Column("float", { name: "skill", precision: 12, default: () => "'0'" })
  skill: number;

  @Column("mediumint", { name: "assists", default: () => "'0'" })
  assists: number;

  @Column("float", { name: "assistskill", precision: 12, default: () => "'0'" })
  assistskill: number;

  @Column("smallint", { name: "winstreak", default: () => "'0'" })
  winstreak: number;

  @Column("smallint", { name: "losestreak", default: () => "'0'" })
  losestreak: number;

  @Column("smallint", { name: "rounds", unsigned: true, default: () => "'0'" })
  rounds: number;

  @Column("int", { name: "year" })
  year: number;

  @Column("int", { name: "month" })
  month: number;

  @Column("int", { name: "week" })
  week: number;

  @Column("int", { name: "day" })
  day: number;
}
