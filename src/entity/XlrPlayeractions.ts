import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("action_id", ["action_id"], {})
@Index("player_id", ["player_id"], {})
@Entity("xlr_playeractions")
export class XlrPlayeractions 
{
    @PrimaryGeneratedColumn({ type: "mediumint", name: "id", unsigned: true })
    id: number;

    @Column("tinyint", {
        name: "action_id",
        unsigned: true,
        default: () => "'0'",
    })
    action_id: number;

    @Column("smallint", {
        name: "player_id",
        unsigned: true,
        default: () => "'0'",
    })
    player_id: number;

    @Column("mediumint", { name: "count", unsigned: true, default: () => "'0'" })
    count: number;
}
