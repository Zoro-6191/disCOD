import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("map_id", ["map_id"], {})
@Index("player_id", ["player_id"], {})
@Entity("xlr_playermaps")
export class XlrPlayermaps 
{
    @PrimaryGeneratedColumn({ type: "mediumint", name: "id", unsigned: true })
    id: number;

    @Column("smallint", { name: "map_id", unsigned: true, default: () => "'0'" })
    map_id: number;

    @Column("smallint", {
        name: "player_id",
        unsigned: true,
        default: () => "'0'",
    })
    player_id: number;

    @Column("mediumint", { name: "kills", unsigned: true, default: () => "'0'" })
    kills: number;

    @Column("mediumint", { name: "deaths", unsigned: true, default: () => "'0'" })
    deaths: number;

    @Column("mediumint", {
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

    @Column("smallint", { name: "rounds", unsigned: true, default: () => "'0'" })
    rounds: number;
}
