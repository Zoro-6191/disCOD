import { BaseEntity, Column, Entity, Index } from "typeorm";

@Index("keyword", ["keyword"], { unique: true })
@Index("level", ["level"], {})
@Entity("groups")
export class Groups extends BaseEntity
{
    // `id` INT(10) UNSIGNED NOT NULL,
    @Column("int", { 
        primary: true, 
        name: "id", 
        unsigned: true,
        nullable: false 
    })
    id: number;

    // `name` VARCHAR(32) NOT NULL DEFAULT '',
    @Column("varchar", { 
        name: "name", 
        length: 32,
        nullable: false,
        default: () => "",
    })
    name: string;

    // `keyword` VARCHAR(32) UNIQUE NOT NULL DEFAULT '',
    @Column("varchar", { 
        name: "keyword", 
        unique: true, 
        length: 32,
        nullable: false,
        default: () => "",
    })
    keyword: string;

    // `level` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @Column("int", { 
        name: "level", 
        unsigned: true, 
        nullable: false,
        default: () => "'0'" 
    })
    level: number;

    // `time_edit` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @Column("int", { 
        name: "time_edit", 
        unsigned: true, 
        nullable: false,
        default: () => "'0'" 
    })
    time_edit: number;

    // `time_add` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @Column("int", { 
        name: "time_add", 
        unsigned: true, 
        nullable: false,
        default: () => "'0'" 
    })
    time_add: number;
}
