import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

enum PenaltyType {
    BAN = "Ban",
    TEMPBAN = "TempBan",
    KICK = "Kick", 
    WARN = "Warning", 
    NOTICE = "Notice"
}

@Index("keyword", ["keyword"], {})
// @Index("type", ["type"], {})
@Index("time_expire", ["time_expire"], {})
@Index("time_add", ["time_add"], {})
@Index("admin_id", ["admin_id"], {})
@Index("inactive", ["inactive"], {})
@Index("client_id", ["client_id"], {})
@Entity("penalties")
export class Penalties 
{
    @PrimaryGeneratedColumn({ 
        type: "int", 
        name: "id", 
        unsigned: true 
    })
    id: number;

    @Column("enum", {
        name: "type",
        enum: PenaltyType,
        default: "Ban",
    })
    type: PenaltyType;

    @Column("int", { name: "client_id", unsigned: true, default: () => "'0'" })
    client_id: number;

    @Column("int", { name: "admin_id", unsigned: true, default: () => "'0'" })
    admin_id: number;

    @Column("int", { name: "duration", unsigned: true, default: () => "'0'" })
    duration: number;

    @Column("tinyint", { name: "inactive", unsigned: true, default: () => "'0'" })
    inactive: number;

    @Column("varchar", { name: "keyword", length: 16 })
    keyword: string;

    @Column("varchar", { name: "reason", length: 255 })
    reason: string;

    @Column("varchar", { name: "data", length: 255 })
    data: string;

    @Column("int", { name: "time_add", unsigned: true, default: () => "'0'" })
    time_add: number;

    @Column("int", { name: "time_edit", unsigned: true, default: () => "'0'" })
    time_edit: number;

    @Column("int", { name: "time_expire", default: () => "'0'" })
    time_expire: number;
}
