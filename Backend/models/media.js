//model definition
module.exports = (sequelize, DataTypes) => {
  const Media = sequelize.define(
    "Media",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      activity_id: { type: DataTypes.INTEGER, allowNull: false },
      type: { type: DataTypes.ENUM("image", "video"), defaultValue: "image", allowNull: false },
      url: { type: DataTypes.STRING, allowNull: false },
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "medias",
      underscored: true,
      timestamps: true,
    } 
  );

  return Media;
};
