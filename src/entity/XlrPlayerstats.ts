import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("client_id", ["client_id"], { unique: true })
@Entity("xlr_playerstats")
export class XlrPlayerstats 
{
    @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
    id: number;

    @Column("int", {
        name: "client_id",
        unique: true,
        unsigned: true,
        default: () => "'0'",
    })
    client_id: number;

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

    @Column("smallint", { name: "curstreak", default: () => "'0'" })
    curstreak: number;

    @Column("smallint", { name: "winstreak", default: () => "'0'" })
    winstreak: number;

    @Column("smallint", { name: "losestreak", default: () => "'0'" })
    losestreak: number;

    @Column("smallint", { name: "rounds", unsigned: true, default: () => "'0'" })
    rounds: number;

    @Column("tinyint", { name: "hide", default: () => "'0'" })
    hide: number;

    @Column("varchar", { name: "fixed_name", length: 32 })
    fixedName: string;

    @Column("varchar", { name: "id_token", length: 10 })
    idToken: string;
}
