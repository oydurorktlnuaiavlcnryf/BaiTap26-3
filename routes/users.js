var express = require("express");
var router = express.Router();
let { validatedResult, CreateUserValidator, ModifyUserValidator } = require("../utils/validator")
let userModel = require("../schemas/users");
let userController = require("../controllers/users");
const { checkLogin,checkRole } = require("../utils/authHandler");
let { uploadExcel } = require('../utils/uploadHandler');
let ExcelJS = require('exceljs');
let crypto = require('crypto');
let roleModel = require('../schemas/roles');
let fs = require('fs');
let mailHandler = require('../utils/mailHandler');


router.get("/", checkLogin,checkRole("ADMIN","MODERATOR"), async function (req, res, next) {
  let users = await userModel
    .find({ isDeleted: false })
  res.send(users);
});

router.get("/:id", async function (req, res, next) {
  try {
    let result = await userModel
      .find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post("/", CreateUserValidator, validatedResult, async function (req, res, next) {
  try {
    let newUser = await userController.CreateAnUser(
      req.body.username, req.body.password, req.body.email,
      req.body.role, req.body.fullname, req.body.avatarUrl
    )
    res.send(newUser);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.post("/import", uploadExcel.single('file'), async function(req, res, next) {
    try {
        if (!req.file) throw new Error("Vui lòng đính kèm file excel");

        // Tìm role 'user'
        let roleUser = await roleModel.findOne({ name: { $regex: new RegExp("^user$", "i") } });
        if (!roleUser) throw new Error("Chưa có role user trong hệ thống");

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const worksheet = workbook.worksheets[0];
        
        let importedUsers = [];
        let errors = [];

        let rowCount = worksheet.rowCount;
        for (let i = 2; i <= rowCount; i++) {
            let row = worksheet.getRow(i);
            let username = row.getCell(1).value?.toString();
            let email = row.getCell(2).value?.toString();
            
            if (username && email) {
                try {
                    let password = crypto.randomBytes(8).toString('hex');
                    let newUser = await userController.CreateAnUser(
                        username, password, email, roleUser._id, undefined, 
                        username, undefined, true, 0
                    );
                    await mailHandler.sendPasswordEmail(email, username, password);
                    importedUsers.push(username);
                } catch (err) {
                    errors.push(`Lỗi dòng ${i}: ${err.message}`);
                }
            }
        }

        // Xoá file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.send({ success: true, importedUsers, errors });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(400).send({ message: err.message });
    }
});

router.put("/:id", ModifyUserValidator, validatedResult, async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;